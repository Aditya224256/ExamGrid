package com.examgrid.model;

import jakarta.persistence.*;

@Entity
@Table(name = "rooms")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    
    public String name;
    public int rows;
    public int cols;
    public int seatCount;
    public String session;
    public String teacher;

    public Room() {}

    public int getCapacity() {
        return rows * cols;
    }
}