import { fillInField, loadPdfForm, savePdf } from './utils';

async function processPdf() {
  const pdfDoc = await loadPdfForm("./form.pdf");
  fillInField(pdfDoc, "name", "John Doe");
  await savePdf(pdfDoc, `./form_${Date.now()}.pdf`);
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
