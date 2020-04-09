import { loadPdfForm, logAcroFieldNames } from './utils';

async function processPdf() {
  const pdfDoc = await loadPdfForm("./form.pdf");
  logAcroFieldNames(pdfDoc);
}

processPdf()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    console.error(err.stack);
    process.exit(1);
  });
