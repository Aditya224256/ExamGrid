package com.examgrid.repository;

import com.examgrid.model.BranchRange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BranchRepository extends JpaRepository<BranchRange, Long> {
    List<BranchRange> findBySessionAndTeacher(String session, String teacher);
    void deleteBySessionAndTeacher(String session, String teacher);
}
