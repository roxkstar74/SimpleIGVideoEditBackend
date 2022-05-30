import unzipper from 'unzipper';
import fs from 'fs';

export const unzip = async (zipFileDest, desiredFilename, writeFileDest) => {
    console.log('unzippin');
    const zip = fs.createReadStream(zipFileDest).pipe(unzipper.Parse({ forceStream: true }));
    console.log('zip parsed');
    for await (const entry of zip) {
        const fileName = entry.path;
        const type = entry.type; // 'Directory' or 'File'
        const size = entry.vars.uncompressedSize; // There is also compressedSize;
        if (fileName === desiredFilename) {
            console.log('saving ' + fileName);
            entry.pipe(fs.createWriteStream(writeFileDest));
            console.log('saved ' + fileName);
        } else {
            console.log('draining ' + fileName);
            entry.autodrain();
        }
    }
}