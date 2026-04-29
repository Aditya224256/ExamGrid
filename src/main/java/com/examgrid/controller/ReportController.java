package com.examgrid.controller;

import com.examgrid.model.RoomResult;
import com.examgrid.model.Student;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @PostMapping("/export-pdf")
    public void exportToPdf(@RequestBody List<RoomResult> rooms, HttpServletResponse response) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=seating_plan.pdf");

        PdfWriter writer = new PdfWriter(response.getOutputStream());
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        document.add(new Paragraph("ExamGrid Seating Arrangement").setFontSize(20).setBold());

        for (RoomResult room : rooms) {
            document.add(new Paragraph("\nRoom: " + room.roomName).setBold());
            document.add(new Paragraph("Rows: " + room.rows + " | Cols: " + room.cols + " | Total Seats: " + room.seatCount));

            Table table = new Table(UnitValue.createPointArray(new float[room.cols])).useAllAvailableWidth();

            for (int i = 0; i < room.seats.size(); i++) {
                Student s = room.seats.get(i);
                if (s != null) {
                    table.addCell(s.roll + "\n(" + s.branch + ")");
                } else {
                    table.addCell("Empty");
                }
            }
            document.add(table);
        }

        document.close();
    }
}
