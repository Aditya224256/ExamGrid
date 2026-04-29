package com.examgrid.repository;

import com.examgrid.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findBySessionAndTeacher(String session, String teacher);
    void deleteBySessionAndTeacher(String session, String teacher);
}
