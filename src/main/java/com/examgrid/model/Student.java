package com.examgrid.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "students")
public class Student {
    @Id
    public int roll;
    public String branch;

    public Student() {}

    public Student(int roll, String branch) {
        this.roll = roll;
        this.branch = branch;
    }
}