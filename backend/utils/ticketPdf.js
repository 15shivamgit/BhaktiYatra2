const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

exports.generateTicketPdf = async (booking, user, tour) => {
  return new Promise(async (resolve, reject) => {
    try {
      const ticketsDir = path.join(__dirname, "..", "tickets");
      if (!fs.existsSync(ticketsDir)) fs.mkdirSync(ticketsDir);

      const fileName = `ticket_${booking._id}.pdf`;
      const filePath = path.join(ticketsDir, fileName);

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Heading
      doc
        .fontSize(22)
        .text("BhaktiYatra - Tour Ticket & Invoice", { align: "center" })
        .moveDown();

      // Basic Info
      doc.fontSize(12);
      doc.text(`Invoice No: INV-${booking._id}`);
      doc.text(`Booking ID: ${booking._id}`);
      doc.text(`Date: ${new Date(booking.createdAt).toLocaleString()}`);
      doc.moveDown();

      // User Info
      doc.fontSize(14).text("Passenger Details", { underline: true });
      doc.fontSize(12);
      doc.text(`Name: ${user.name}`);
      doc.text(`Email: ${user.email}`);
      doc.moveDown();

      // Tour Info
      doc.fontSize(14).text("Tour Details", { underline: true });
      doc.fontSize(12);
      doc.text(`Tour: ${tour.name}`);
      doc.text(`Seats: ${booking.seats}`);
      doc.text(`Price per seat: ₹${tour.price}`);
      doc.moveDown();

      // GST & Amount
      const baseAmount = booking.amount;
      const gstRate = 0.18;
      const gstAmount = Math.round(baseAmount * gstRate);
      const grandTotal = baseAmount + gstAmount;

      doc.fontSize(14).text("Invoice Summary", { underline: true });
      doc.fontSize(12);
      doc.text(`Base Fare: ₹${baseAmount}`);
      doc.text(`GST (18%): ₹${gstAmount}`);
      doc.text(`Total Amount: ₹${grandTotal}`, { bold: true });
      doc.moveDown();

      // QR Code - encode basic booking info
      const qrData = `BhaktiYatra Booking\nBookingID: ${booking._id}\nUser: ${user.name}\nTour: ${tour.name}\nSeats: ${booking.seats}\nPaid: ₹${grandTotal}`;
      const qrImageDataUrl = await QRCode.toDataURL(qrData);

      const base64Data = qrImageDataUrl.replace(/^data:image\/png;base64,/, "");
      const qrPath = path.join(ticketsDir, `qr_${booking._id}.png`);
      fs.writeFileSync(qrPath, base64Data, "base64");

      doc.moveDown();
      doc.text("Scan QR at Check-in:", { align: "left" });
      doc.image(qrPath, { fit: [120, 120] });

      doc.moveDown(2);
      doc.fontSize(10).text("Thank you for choosing BhaktiYatra!", {
        align: "center",
      });

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};
