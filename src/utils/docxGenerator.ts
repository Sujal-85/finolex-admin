import { Document, Packer, Paragraph, Table, TableRow, TableCell, ImageRun, TextRun, AlignmentType, HeadingLevel, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

export type ReportSection =
    | { type: 'text'; title?: string; content: string[] }
    | { type: 'table'; title?: string; columns: string[]; data: any[][] }
    | { type: 'image'; title?: string; content: string; width?: number; height?: number }
    | { type: 'stats'; title?: string; stats: { label: string; value: string | number }[] }
    | { type: 'section'; title?: string; description?: string };

const fetchImageAsBuffer = async (url: string): Promise<Uint8Array> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
};

export const generateMultiSectionDOCXReport = async (
    reportTitle: string,
    sections: ReportSection[],
    fileName: string
) => {
    // Basic formatting constants
    const HEADING_COLOR = "2980b9";
    const TEXT_COLOR = "323232";
    const TABLE_HEADER_FILL = "2980b9";

    const docSections = [];

    try {
        // Fetch branding assets
        const [famtLogo, canteenLogo, signature] = await Promise.all([
            fetchImageAsBuffer('/famt-logo.png').catch(() => null),
            fetchImageAsBuffer('/logo.png').catch(() => null),
            fetchImageAsBuffer('/manager_signature.png').catch(() => null)
        ]);

        // Header Table for Logos
        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: famtLogo ? [
                                new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: famtLogo,
                                            transformation: { width: 50, height: 50 },
                                            type: "png"
                                        })
                                    ]
                                })
                            ] : [],
                            border: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: "Finolex Academy of Management & Technology", bold: true, size: 24 })],
                                    alignment: AlignmentType.CENTER
                                }),
                                new Paragraph({
                                    children: [new TextRun({ text: reportTitle, bold: true, size: 28, color: HEADING_COLOR })],
                                    alignment: AlignmentType.CENTER
                                })
                            ],
                            border: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                        }),
                        new TableCell({
                            children: canteenLogo ? [
                                new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: canteenLogo,
                                            transformation: { width: 50, height: 50 },
                                            type: "png"
                                        })
                                    ],
                                    alignment: AlignmentType.RIGHT
                                })
                            ] : [],
                            border: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                        })
                    ]
                })
            ]
        });

        docSections.push(headerTable);
        docSections.push(new Paragraph({ text: "", spacing: { after: 400 } }));

        for (const section of sections) {
            if (section.title) {
                docSections.push(
                    new Paragraph({
                        children: [new TextRun({ text: section.title, size: 22, bold: true, color: HEADING_COLOR })],
                        spacing: { before: 400, after: 200 },
                    })
                );
            }

            if (section.type === 'text') {
                for (const line of section.content) {
                    docSections.push(
                        new Paragraph({
                            children: [new TextRun({ text: line, size: 20, color: TEXT_COLOR })],
                            spacing: { after: 200 }
                        })
                    );
                }
            } else if (section.type === 'table') {
                const table = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        // Header Row
                        new TableRow({
                            children: section.columns.map(col => new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text: col, bold: true, color: "ffffff" })],
                                    alignment: AlignmentType.CENTER
                                })],
                                shading: { fill: TABLE_HEADER_FILL },
                                margins: { top: 100, bottom: 100, left: 100, right: 100 }
                            }))
                        }),
                        // Data Rows
                        ...section.data.map((row: any[]) => new TableRow({
                            children: row.map(cell => new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text: String(cell), size: 18 })]
                                })],
                                margins: { top: 100, bottom: 100, left: 100, right: 100 }
                            }))
                        }))
                    ],
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" }
                    }
                });
                docSections.push(table);
                docSections.push(new Paragraph({ text: "", spacing: { after: 400 } })); // Spacer
            } else if (section.type === 'image') {
                const base64Data = section.content.split(',')[1];
                const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                docSections.push(
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: imageBuffer,
                                transformation: {
                                    width: section.width || 600,
                                    height: section.height || 350
                                },
                                type: "png"
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    })
                );
            } else if (section.type === 'stats') {
                for (const stat of section.stats) {
                    docSections.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `${stat.label}: `, bold: true }),
                                new TextRun({ text: String(stat.value) })
                            ],
                            spacing: { after: 100 }
                        })
                    );
                }
                docSections.push(new Paragraph({ text: "", spacing: { after: 200 } }));
            } else if (section.type === 'section') {
                if (section.description) {
                    docSections.push(
                        new Paragraph({
                            children: [new TextRun({ text: section.description, italics: true, color: "666666" })],
                            spacing: { after: 300 }
                        })
                    );
                }
            }
        }

        // signature section
        if (signature) {
            docSections.push(
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: signature,
                            transformation: { width: 100, height: 50 },
                            type: "png"
                        })
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 800 }
                })
            );
        } else {
            docSections.push(new Paragraph({ text: "", spacing: { before: 1000 } }));
        }

        docSections.push(
            new Paragraph({
                children: [new TextRun({ text: "Authorized Signature:", bold: true })],
                alignment: AlignmentType.RIGHT
            }),
            new Paragraph({
                children: [new TextRun({ text: "MR. Sandeep Tambe", italics: true })],
                alignment: AlignmentType.RIGHT
            }),
            new Paragraph({
                children: [new TextRun({ text: "Manager, FAMT Mess", size: 18, color: "666666" })],
                alignment: AlignmentType.RIGHT
            })
        );

        const doc = new Document({
            sections: [{
                children: docSections
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${fileName}.docx`);
    } catch (error) {
        console.error("DOCX generation failed", error);
        throw error;
    }
};

export const generateDOCXReport = async (
    reportTitle: string,
    columns: string[],
    data: any[][],
    fileName: string
) => {
    return generateMultiSectionDOCXReport(
        reportTitle,
        [{ type: 'table' as const, columns, data }],
        fileName
    );
};
