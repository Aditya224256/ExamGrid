package com.examgrid.service;

import com.examgrid.model.*;

import java.util.*;
import java.util.stream.Collectors;

public class SeatingAlgorithm {

    public static List<RoomResult> generateSeating(SeatingRequest request) {
        Map<String, List<Student>> branchMap = generateBranchMap(request.branches, request.debarred);
        return performGeneration(request, branchMap);
    }

    private static List<RoomResult> performGeneration(SeatingRequest request, Map<String, List<Student>> branchMap) {
        List<RoomResult> results = new ArrayList<>();

        for (Room room : request.roomConfigs) {
            Student[][] grid = new Student[room.rows][room.cols];

            for (int r = 0; r < room.rows; r++) {
                for (int c = 0; c < room.cols; c++) {
                    Student chosen = pickBestStudent(branchMap, grid, r, c, room);
                    grid[r][c] = chosen;
                }
            }

            List<Student> flatSeats = new ArrayList<>();
            for (int r = 0; r < room.rows; r++) {
                for (int c = 0; c < room.cols; c++) {
                    flatSeats.add(grid[r][c]);
                }
            }

            results.add(new RoomResult(
                    room.name,
                    room.rows,
                    room.cols,
                    room.getCapacity(),
                    flatSeats
            ));
        }

        return results;
    }

    public static List<Student> getUnallocated(SeatingRequest request) {
        Map<String, List<Student>> branchMap = generateBranchMap(request.branches, request.debarred);
        
        // Run the generation logic to consume students from the map
        performGeneration(request, branchMap); 

        List<Student> unallocated = new ArrayList<>();
        for (List<Student> remaining : branchMap.values()) {
            unallocated.addAll(remaining);
        }
        return unallocated;
    }

    private static Map<String, List<Student>> generateBranchMap(List<BranchRange> branches, List<Integer> debarred) {
        Map<String, List<Student>> branchMap = new LinkedHashMap<>();
        Set<Integer> debarSet = (debarred != null) ? new HashSet<>(debarred) : new HashSet<>();

        for (BranchRange branch : branches) {
            List<Student> students = new ArrayList<>();
            for (int roll = branch.startRoll; roll <= branch.endRoll; roll++) {
                if (!debarSet.contains(roll)) {
                    students.add(new Student(roll, branch.name.toUpperCase()));
                }
            }
            branchMap.put(branch.name.toUpperCase(), students);
        }

        return branchMap;
    }

    private static Student pickBestStudent(Map<String, List<Student>> branchMap, Student[][] grid, int row, int col, Room room) {
        // Priority: Branch with most students left (Roundtable rule)
        List<String> sortedBranches = branchMap.keySet().stream()
                .filter(b -> !branchMap.get(b).isEmpty())
                .collect(Collectors.toList());
        
        // Shuffle first to ensure that branches with the same size get picked in random order
        Collections.shuffle(sortedBranches);
        
        // Then sort by size (stable sort maintains the shuffle for equal elements)
        sortedBranches.sort((a, b) -> branchMap.get(b).size() - branchMap.get(a).size());

        // 1st pass: Try to find a branch that doesn't conflict with ANY neighbor
        for (String branch : sortedBranches) {
            if (!hasConflict(grid, row, col, branch, room)) {
                return branchMap.get(branch).remove(0);
            }
        }

        // 2nd pass: Fallback to any branch if no conflict-free choice exists (but still prioritize largest)
        if (!sortedBranches.isEmpty()) {
            return branchMap.get(sortedBranches.get(0)).remove(0);
        }

        return null;
    }

    private static boolean hasConflict(Student[][] grid, int row, int col, String branch, Room room) {
        // Check 8 neighbors (Moore neighborhood)
        int[] dr = {-1, -1, -1, 0, 0, 1, 1, 1};
        int[] dc = {-1, 0, 1, -1, 1, -1, 0, 1};

        for (int i = 0; i < 8; i++) {
            int nr = row + dr[i];
            int nc = col + dc[i];

            if (nr >= 0 && nr < room.rows && nc >= 0 && nc < room.cols) {
                Student neighbor = grid[nr][nc];
                if (neighbor != null && neighbor.branch.equals(branch)) {
                    return true;
                }
            }
        }
        return false;
    }
}