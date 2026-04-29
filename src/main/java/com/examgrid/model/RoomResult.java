package com.examgrid.model;

import java.util.List;

public class RoomResult {
    public String roomName;
    public int rows;
    public int cols;
    public int seatCount;
    public List<Student> seats;

    public RoomResult() {}

    public RoomResult(String roomName, int rows, int cols, int seatCount, List<Student> seats) {
        this.roomName = roomName;
        this.rows = rows;
        this.cols = cols;
        this.seatCount = seatCount;
        this.seats = seats;
    }
}