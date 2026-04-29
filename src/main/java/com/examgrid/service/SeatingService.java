package com.examgrid.service;

import com.examgrid.model.*;
import com.examgrid.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class SeatingService {

    @Autowired
    private BranchRepository branchRepository;
    @Autowired
    private RoomRepository roomRepository;

    @Transactional
    public void saveBranches(String session, String teacher, List<BranchRange> branches) {
        branchRepository.deleteBySessionAndTeacher(session, teacher);
        for (BranchRange b : branches) {
            b.session = session;
            b.teacher = teacher;
        }
        branchRepository.saveAll(branches);
    }

    @Transactional
    public void saveRooms(String session, String teacher, List<Room> rooms) {
        roomRepository.deleteBySessionAndTeacher(session, teacher);
        for (Room r : rooms) {
            r.session = session;
            r.teacher = teacher;
        }
        roomRepository.saveAll(rooms);
    }

    public List<BranchRange> getBranchesBySessionAndTeacher(String session, String teacher) {
        return branchRepository.findBySessionAndTeacher(session, teacher);
    }

    public List<Room> getRoomsBySessionAndTeacher(String session, String teacher) {
        return roomRepository.findBySessionAndTeacher(session, teacher);
    }

    public Map<String, Object> generateAndSave(SeatingRequest request) {
        List<RoomResult> rooms = SeatingAlgorithm.generateSeating(request);
        List<Student> unallocated = SeatingAlgorithm.getUnallocated(request);

        Map<String, Object> response = new HashMap<>();
        response.put("seatingData", rooms);
        response.put("unallocated", unallocated);
        
        return response;
    }
}
