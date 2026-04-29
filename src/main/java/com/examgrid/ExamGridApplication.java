package com.examgrid;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import java.awt.Desktop;
import java.net.URI;

@SpringBootApplication
public class ExamGridApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExamGridApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void openBrowser() {
        System.setProperty("java.awt.headless", "false");
        try {
            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().browse(new URI("http://localhost:8080"));
            } else {
                Runtime runtime = Runtime.getRuntime();
                runtime.exec("rundll32 url.dll,FileProtocolHandler http://localhost:8080");
            }
        } catch (Exception e) {
            System.out.println("Could not open browser automatically. Please visit http://localhost:8080 manually.");
        }
    }
}

