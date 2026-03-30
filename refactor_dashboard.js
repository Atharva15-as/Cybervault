import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pathStr = join(__dirname, 'src/pages/Dashboard.tsx');
const contentOriginal = fs.readFileSync(pathStr, 'utf8');
const lines = contentOriginal.split(/\r?\n/);

const iUpload = lines.findIndex(l => l.includes('{/* Upload Section */}'));
const iTwoCol = lines.findIndex(l => l.includes('{/* Two-Column Layout: Files Table + Decryption Tool */}'));
const iLeft = lines.findIndex(l => l.includes('{/* LEFT SIDE — Search, Filter & Files Table */}'));
const iRight = lines.findIndex(l => l.includes('{/* RIGHT SIDE — Decryption Tool */}'));
const iEnd = lines.findIndex(l => l.includes('{/* Download/Decrypt Modal */}'));

if ([iUpload, iTwoCol, iLeft, iRight, iEnd].includes(-1)) {
    console.error("Could not find all markers.");
    process.exit(1);
}

// Ensure we don't double process
if (iUpload > iTwoCol || contentOriginal.includes('{/* Top Section: Upload Files + Decryption Tool */}')) {
    console.log("Already refactored, skipping");
    process.exit(0);
}

// Extract Upload lines (excluding the empty lines at the end)
let uploadLines = lines.slice(iUpload, iTwoCol - 1);
let newUploadLines = [];
let draggingDiv = false;
for(let i=0; i<uploadLines.length; i++) {
    let line = uploadLines[i];
    if(line.includes('border-2 border-dashed transition-all')) {
        line = line.replace('mb-8 border-2', 'h-full flex flex-col justify-center border-2');
    }
    // Remove "Upload Section" comment itself to avoid duplication in case
    newUploadLines.push(line);
}

// Extract Decrypt lines
let decryptLines = lines.slice(iRight, iEnd - 2); 
let newDecryptLines = [];
for(let i=0; i<decryptLines.length; i++){
    let line = decryptLines[i];
    if(line.includes('glass-card p-6 sticky top-28')){
        line = line.replace('sticky top-28', 'h-full flex flex-col justify-center');
    }
    newDecryptLines.push(line);
}

// Extract Files lines (from LEFT SIDE to RIGHT SIDE)
let filesLines = lines.slice(iLeft, iRight - 1); // skip the empty line before right side
let newFilesLines = [];
for(let i=0; i<filesLines.length; i++) {
    let line = filesLines[i];
    if(line.includes('className="xl:col-span-8"')) {
        line = line.replace('xl:col-span-8', 'w-full');
    }
    if(line.includes('{/* LEFT SIDE — Search, Filter & Files Table */}')) {
         line = line.replace('LEFT SIDE — Search, Filter & Files Table', 'BOTTOM SECTION — Files Table');
    }
    newFilesLines.push(line);
}

let newLines = [
    ...lines.slice(0, iUpload), // up to Upload block
    '                {/* Top Section: Upload Files + Decryption Tool */}',
    '                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8 items-stretch">',
    '                    {/* LEFT SIDE — Upload Section */}',
    '                    <div className="xl:col-span-8">',
    ...newUploadLines.map(l => {
        // adjust indentation to match the extra nesting
        // actually 8 spaces from `xl:col-span-8`, original was inside `w-full`
        // let's just keep original indentation and add a slight indent or keep it.
        // original was indented 16 spaces for div, let's keep it.
        if (l.trim() === '{/* Upload Section */}') return '';
        return '        ' + l.trimStart();
    }),
    '                    </div>',
    '',
    ...newDecryptLines,
    '                </div>',
    '',
    // the files list comes with its own enclosing div class w-full (originally col-span-8)
    ...newFilesLines,
    ...lines.slice(iEnd - 1)  // everything after
];

// Re-add removed empty lines
let assembled = newLines.filter(x => x !== null).join('\n');

fs.writeFileSync(pathStr, assembled);
console.log('Restructured successfully.');
