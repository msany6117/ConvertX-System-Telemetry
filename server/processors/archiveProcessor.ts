import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import * as archiverModule from 'archiver';
const archiver = (archiverModule as any).default || archiverModule;

export async function createZipArchive(
  files: Array<{ sourcePath: string; entryName: string }>,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    for (const f of files) {
      if (fs.existsSync(f.sourcePath)) {
        archive.file(f.sourcePath, { name: f.entryName });
      }
    }

    archive.finalize();
  });
}

export async function extractZipArchive(
  zipPath: string,
  outputDir: string
): Promise<string[]> {
  const bytes = await fs.promises.readFile(zipPath);
  const zip = await JSZip.loadAsync(bytes);
  const extractedFiles: string[] = [];

  for (const [filename, fileObj] of Object.entries(zip.files)) {
    if (fileObj.dir) continue;
    // Prevent zip slip path traversal
    const safeName = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '');
    const destPath = path.join(outputDir, safeName);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    const content = await fileObj.async('nodebuffer');
    await fs.promises.writeFile(destPath, content);
    extractedFiles.push(destPath);
  }

  return extractedFiles;
}
