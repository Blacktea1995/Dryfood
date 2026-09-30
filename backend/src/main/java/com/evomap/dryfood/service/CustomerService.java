package com.evomap.dryfood.service;

import com.evomap.dryfood.exception.NotFoundException;
import com.evomap.dryfood.model.Customer;
import com.evomap.dryfood.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> findAll() {
        return customerRepository.findAllByOrderByIdDesc();
    }

    public Customer findById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Khong tim thay khach hang id=" + id));
    }

    public List<Customer> search(String q) {
        if (q == null || q.isBlank()) {
            return findAll();
        }
        return customerRepository.search(q.trim());
    }

    @Transactional
    public Customer create(Customer customer) {
        return customerRepository.save(customer);
    }

    @Transactional
    public Customer update(Long id, Customer updated) {
        Customer c = findById(id);
        c.setName(updated.getName());
        c.setEmail(updated.getEmail());
        c.setPhone(updated.getPhone());
        c.setAddress(updated.getAddress());
        return customerRepository.save(c);
    }

    @Transactional
    public void delete(Long id) {
        Customer c = findById(id);
        customerRepository.delete(c);
    }
}
