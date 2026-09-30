package com.evomap.dryfood.repository;

import com.evomap.dryfood.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT c FROM Customer c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.phone) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Customer> search(@Param("q") String q);

    List<Customer> findAllByOrderByIdDesc();
}
