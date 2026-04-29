package com.examgrid.model;

import jakarta.persistence.*;

@Entity
@Table(name = "branches")
public class BranchRange {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    
    public String name;
    public int startRoll;
    public int endRoll;
    public String session;
    public String teacher;

    public BranchRange() {}
}