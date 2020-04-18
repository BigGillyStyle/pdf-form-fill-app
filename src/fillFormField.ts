import * as faker from 'faker';

import { fillInField, loadPdfForm, savePdf } from './utils';

async function processPdf() {
  const pdfDoc = await loadPdfForm("./form.pdf");
  fillInField(pdfDoc, "name", "John Doe");
  const bigText = faker.lorem.paragraphs(100);
  fillInField(pdfDoc, "summary_statement_of_deficiencies_row1", bigText);
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
