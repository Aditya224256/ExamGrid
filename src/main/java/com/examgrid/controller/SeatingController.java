package com.examgrid.controller;

import com.examgrid.model.*;
import com.examgrid.service.SeatingAlgorithm;
import com.examgrid.service.SeatingService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/seating")
@CrossOrigin(origins = "*")
public class SeatingController {

    @Autowired
    private SeatingService seatingService;

    @PostMapping("/generate")
    public Map<String, Object> generateSeating(@RequestBody SeatingRequest request) {
        return seatingService.generateAndSave(request);
    }

    @PostMapping("/branches")
    public String saveBranches(@RequestBody Map<String, Object> payload) {
        String session = (String) payload.get("session");
        String teacher = (String) payload.get("teacher");
        List<Map<String, Object>> branchMaps = (List<Map<String, Object>>) payload.get("branches");

        List<BranchRange> branches = new ArrayList<>();
        for (Map<String, Object> m : branchMaps) {
            BranchRange b = new BranchRange();
            b.name = (String) m.get("name");
            b.startRoll = (Integer) m.get("startRoll");
            b.endRoll = (Integer) m.get("endRoll");
            branches.add(b);
        }

        seatingService.saveBranches(session, teacher, branches);
        return "Branches saved successfully";
    }

    @GetMapping("/branches")
    public List<BranchRange> getBranches(@RequestParam String session, @RequestParam String teacher) {
        return seatingService.getBranchesBySessionAndTeacher(session, teacher);
    }

    @PostMapping("/rooms")
    public String saveRooms(@RequestBody Map<String, Object> payload) {
        String session = (String) payload.get("session");
        String teacher = (String) payload.get("teacher");
        List<Map<String, Object>> roomMaps = (List<Map<String, Object>>) payload.get("configs");

        List<Room> rooms = new ArrayList<>();
        for (Map<String, Object> m : roomMaps) {
            Room r = new Room();
            r.name = (String) m.get("name");
            r.rows = (Integer) m.get("rows");
            r.cols = (Integer) m.get("cols");
            r.seatCount = (Integer) m.get("seatCount");
            rooms.add(r);
        }

        seatingService.saveRooms(session, teacher, rooms);
        return "Rooms saved successfully";
    }

    @GetMapping("/rooms")
    public List<Room> getRooms(@RequestParam String session, @RequestParam String teacher) {
        return seatingService.getRoomsBySessionAndTeacher(session, teacher);
    }

    @PostMapping("/search-student")
    public Map<String, Object> searchStudent(@RequestParam int roll, @RequestParam String branch,
            @RequestBody List<RoomResult> seatingData) {
        Map<String, Object> result = new HashMap<>();
        for (RoomResult room : seatingData) {
            for (int i = 0; i < room.seats.size(); i++) {
                Student s = room.seats.get(i);
                if (s != null && s.roll == roll && s.branch.equalsIgnoreCase(branch)) {
                    result.put("found", true);
                    result.put("roomName", room.roomName);
                    result.put("seatNo", i + 1);
                    return result;
                }
            }
        }
        result.put("found", false);
        return result;
    }
}