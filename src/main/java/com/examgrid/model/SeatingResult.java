package com.examgrid.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "seating_results")
public class SeatingResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    
    public String roomName;
    public int rows;
    public int cols;
    public int seatCount;

    @ManyToMany
    @JoinTable(
        name = "seating_allocation",
        joinColumns = @JoinColumn(name = "seating_id"),
        inverseJoinColumns = @JoinColumn(name = "student_roll")
    )
    public List<Student> seats;

    public SeatingResult() {}

    public SeatingResult(String roomName, int rows, int cols, int seatCount, List<Student> seats) {
        this.roomName = roomName;
        this.rows = rows;
        this.cols = cols;
        this.seatCount = seatCount;
        this.seats = seats;
    }
}
