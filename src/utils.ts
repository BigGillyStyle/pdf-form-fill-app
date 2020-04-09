import * as fs from 'fs';
import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFString
} from 'pdf-lib';

export const getAcroForm = (pdfDoc: PDFDocument): PDFDict | undefined =>
  pdfDoc.catalog.lookup(PDFName.of("AcroForm"), PDFDict);

export const getAcroFields = (pdfDoc: PDFDocument): PDFDict[] => {
  const acroForm = getAcroForm(pdfDoc);
  if (!acroForm) return [];

  const fieldRefs = acroForm.lookupMaybe(PDFName.of("Fields"), PDFArray);
  if (!fieldRefs) return [];

  const fields = Array<PDFDict>(fieldRefs.size());
  // tslint:disable-next-line: no-increment-decrement
  for (let idx = 0, len = fieldRefs.size(); idx < len; idx++) {
    const field = fieldRefs.lookup(idx, PDFDict);
    if (!!field) {
      fields[idx] = field;
    }
  }

  return fields;
};

const findAcroFieldByName = (
  pdfDoc: PDFDocument,
  name: string
): PDFDict | undefined => {
  const acroFields = getAcroFields(pdfDoc);

  return acroFields.find((acroField) => {
    const fieldName = acroField.get(PDFName.of("T"));
    console.log("findAcroFieldByName -> fieldName", fieldName);
    if (fieldName?.toString() === "(name)") {
      console.log("findAcroFieldByName -> acroField", acroField);
    }

    // This is ugly, library-specific comparison due to PDFString.value being a private field
    return !!fieldName && fieldName.toString() === `(${name})`;
  });
};

const fillAcroTextField = (acroField: PDFDict, text: string) => {
  acroField.set(PDFName.of("V"), PDFString.of(text));
  acroField.set(PDFName.of("Ff"), PDFNumber.of((1 << 0) | (1 << 12)));
};

const lockField = (acroField: any) => {
  const fieldType = acroField.lookup(PDFName.of("FT"));
  if (fieldType === PDFName.of("Tx")) {
    // tslint:disable-next-line: no-bitwise
    acroField.set(PDFName.of("Ff"), PDFNumber.of(1 << 0 /* Read Only */));
  }
};

const prepFormBeforeSave = (pdfDoc: PDFDocument) => {
  const acroFields = getAcroFields(pdfDoc);
  acroFields.forEach((field) => {
    field.delete(PDFName.of("AP"));
    lockField(field);
  });
};

const makePdfViewersHappy = (pdfDoc: PDFDocument) => {
  const acroForm = getAcroForm(pdfDoc);
  if (acroForm) {
    // this line does NOT appear to help
    acroForm.delete(PDFName.of("XFA"));

    // this line enables successful rendering of form in Adobe Acrobat and Chrome
    acroForm.set(PDFName.of("NeedAppearances"), PDFBool.True);
  } else {
    throw new Error("AcroForm not found");
  }

  // these lines do NOT appear to help
  const acroFields = getAcroFields(pdfDoc);
  acroFields.forEach((field) => field.delete(PDFName.of("AS")));
};

export const fillInField = (
  pdfDoc: PDFDocument,
  fieldName: string,
  text: string
) => {
  const field = findAcroFieldByName(pdfDoc, fieldName);
  if (field) {
    console.log(`Field ${fieldName} found.  Writing value of ${text}`);
    fillAcroTextField(field, text);
  } else {
    console.error(`Field ${fieldName} not found`);
  }
};

export async function loadPdfForm(filename: string): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.load(fs.readFileSync(filename));
  makePdfViewersHappy(pdfDoc);

  return pdfDoc;
}

export async function savePdf(pdfDoc: PDFDocument, filename: string) {
  prepFormBeforeSave(pdfDoc);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filename, pdfBytes);
}

export const logAcroFieldNames = (pdfDoc: PDFDocument) => {
  const acroFields = getAcroFields(pdfDoc);
  acroFields.forEach((acroField) => {
    const fieldName = acroField.get(PDFName.of("T"));
    const fieldType = acroField.get(PDFName.of("FT"));
    if (fieldName && fieldType) {
      console.log(
        "Field Name:",
        fieldName.toString(),
        "Field Type:",
        fieldType.toString()
      );
    }
  });
};
