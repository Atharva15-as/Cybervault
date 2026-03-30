// Steganography Service — Hide encrypted data inside images using LSB

export const steganographyService = {
    /**
     * Hide data inside an image using LSB (Least Significant Bit) steganography
     */
    async hideDataInImage(imageFile: File, secretData: string): Promise<Blob> {
        const img = await loadImage(imageFile);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Convert secret data to binary
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(secretData);
        const dataLength = dataBytes.length;

        // Check capacity (3 bits per pixel for RGB channels, reserve alpha)
        const maxBytes = Math.floor((pixels.length / 4) * 3 / 8) - 4; // -4 for length header
        if (dataLength > maxBytes) {
            throw new Error(`Image too small. Max capacity: ${maxBytes} bytes, data size: ${dataLength} bytes`);
        }

        // Encode data length first (4 bytes = 32 bits)
        const lengthBits = dataLength.toString(2).padStart(32, '0');
        let bitIndex = 0;

        // Write length bits
        for (let i = 0; i < 32; i++) {
            const pixelIdx = Math.floor(bitIndex / 3) * 4;
            const channel = bitIndex % 3; // R=0, G=1, B=2
            pixels[pixelIdx + channel] = (pixels[pixelIdx + channel] & 0xFE) | parseInt(lengthBits[i]);
            bitIndex++;
        }

        // Write data bits
        for (let byteIdx = 0; byteIdx < dataLength; byteIdx++) {
            const byte = dataBytes[byteIdx];
            for (let bit = 7; bit >= 0; bit--) {
                const pixelIdx = Math.floor(bitIndex / 3) * 4;
                const channel = bitIndex % 3;
                pixels[pixelIdx + channel] = (pixels[pixelIdx + channel] & 0xFE) | ((byte >> bit) & 1);
                bitIndex++;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
    },

    /**
     * Extract hidden data from a steganographic image
     */
    async extractDataFromImage(imageFile: File): Promise<string> {
        const img = await loadImage(imageFile);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        let bitIndex = 0;

        // Read data length (32 bits)
        let lengthBits = '';
        for (let i = 0; i < 32; i++) {
            const pixelIdx = Math.floor(bitIndex / 3) * 4;
            const channel = bitIndex % 3;
            lengthBits += (pixels[pixelIdx + channel] & 1).toString();
            bitIndex++;
        }
        const dataLength = parseInt(lengthBits, 2);

        if (dataLength <= 0 || dataLength > 10000000) {
            throw new Error('No hidden data found or data is corrupted');
        }

        // Read data bytes
        const dataBytes = new Uint8Array(dataLength);
        for (let byteIdx = 0; byteIdx < dataLength; byteIdx++) {
            let byte = 0;
            for (let bit = 7; bit >= 0; bit--) {
                const pixelIdx = Math.floor(bitIndex / 3) * 4;
                const channel = bitIndex % 3;
                byte |= (pixels[pixelIdx + channel] & 1) << bit;
                bitIndex++;
            }
            dataBytes[byteIdx] = byte;
        }

        return new TextDecoder().decode(dataBytes);
    },

    /**
     * Calculate image capacity for hidden data
     */
    async getImageCapacity(imageFile: File): Promise<{
        width: number;
        height: number;
        maxBytes: number;
        maxKB: string;
    }> {
        const img = await loadImage(imageFile);
        const totalPixels = img.width * img.height;
        const maxBytes = Math.floor(totalPixels * 3 / 8) - 4;
        return {
            width: img.width,
            height: img.height,
            maxBytes,
            maxKB: (maxBytes / 1024).toFixed(1),
        };
    },
};

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

export default steganographyService;
