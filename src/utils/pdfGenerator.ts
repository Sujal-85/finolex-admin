import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportSection =
    | { type: 'text'; title?: string; content: string[] }
    | { type: 'table'; title?: string; columns: string[]; data: any[][] }
    | { type: 'image'; title?: string; content: string; width?: number; height?: number };

export const generateMultiSectionReport = async (
    reportTitle: string,
    sections: ReportSection[],
    fileName: string
) => {
    const doc = new jsPDF();

    // Helper to load image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
        });
    };

    let famtLogo: HTMLImageElement | null = null;
    let businessLogo: HTMLImageElement | null = null;
    let signatureImg: HTMLImageElement | null = null;

    try {
        famtLogo = await loadImage("/famt-logo.png");
        businessLogo = await loadImage("/logo-removebg.png");
        signatureImg = await loadImage("/manager_signature.png");
    } catch (e) {
        console.warn("Error loading images:", e);
    }

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- Header Helper ---
    const addHeader = (isFirstPage: boolean) => {
        if (famtLogo) {
            doc.addImage(famtLogo, "PNG", 14, 10, 20, 20);
        }

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Finolex Academy of Management & Technology", pageWidth / 2, 20, { align: "center" });

        if (isFirstPage) {
            doc.setFontSize(16);
            doc.text(reportTitle, pageWidth / 2, 35, { align: "center" });
            if (businessLogo) {
                doc.addImage(businessLogo, "PNG", pageWidth - 34, 10, 20, 20);
            }
        }
    };

    // Initial Header
    addHeader(true);

    let currentY = 50;

    // --- Process Sections ---
    for (const section of sections) {
        // Check for page break readiness
        if (currentY > pageHeight - 50) {
            doc.addPage();
            addHeader(false);
            currentY = 40;
        }

        if (section.title) {
            doc.setFontSize(12);
            doc.setTextColor(41, 128, 185); // Theme Blue
            doc.setFont("helvetica", "bold");
            doc.text(section.title, 14, currentY);
            currentY += 8;
        }

        if (section.type === 'text') {
            doc.setFontSize(10);
            doc.setTextColor(50);
            doc.setFont("helvetica", "normal");

            for (const line of section.content) {
                const splitText = doc.splitTextToSize(line, pageWidth - 28);
                const textHeight = splitText.length * 5;

                if (currentY + textHeight > pageHeight - 40) {
                    doc.addPage();
                    addHeader(false);
                    currentY = 40;
                }

                doc.text(splitText, 14, currentY);
                currentY += textHeight + 4; // Spacing between paragraphs
            }
            currentY += 5; // Spacing after text section
        }
        else if (section.type === 'image') {
            const imgWidth = section.width || 180;
            const imgHeight = section.height || 100;
            // Scale down if too wide
            const finalWidth = imgWidth > pageWidth - 28 ? pageWidth - 28 : imgWidth;
            const ratio = finalWidth / imgWidth;
            const finalHeight = imgHeight * ratio;

            if (currentY + finalHeight > pageHeight - 40) {
                doc.addPage();
                addHeader(false);
                currentY = 40;
            }

            doc.addImage(section.content, 'PNG', 14, currentY, finalWidth, finalHeight);
            currentY += finalHeight + 10;
        }
        else if (section.type === 'table') {
            autoTable(doc, {
                head: [section.columns],
                body: section.data,
                startY: currentY,
                theme: 'grid',
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                styles: {
                    fontSize: 10,
                    font: "helvetica",
                    textColor: 50
                },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { top: 40, bottom: 60 },
                didDrawPage: (data) => {
                    // StartY update for next sections if table breaks page
                    currentY = data.cursor ? data.cursor.y + 10 : currentY;
                }
            });

            // Update Y after table
            currentY = (doc as any).lastAutoTable.finalY + 15;
        }
    }

    // --- Footer (Signature) ---
    const totalPages = (doc as any).internal.getNumberOfPages();

    // Ensure space for signature
    if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 40;
    }

    const signatureY = currentY + 10;

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("Authorized Signature:", pageWidth - 50, signatureY, { align: 'center' });

    if (signatureImg) {
        doc.addImage(signatureImg, 'PNG', pageWidth - 70, signatureY + 5, 40, 20);
    }

    doc.text("MR. Sandeep Tambe", pageWidth - 50, signatureY + 30, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Manager, FAMT Mess", pageWidth - 50, signatureY + 35, { align: 'center' });

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: "right" });
        doc.text("Finolex Canteen Admin Panel", 14, pageHeight - 10);
    }

    doc.save(`${fileName}.pdf`);
};

// Backward compatibility wrapper
export const generatePDFReport = async (
    reportTitle: string,
    columns: string[],
    data: any[][],
    fileName: string
) => {
    return generateMultiSectionReport(
        reportTitle,
        [{ type: 'table', columns, data }],
        fileName
    );
};

