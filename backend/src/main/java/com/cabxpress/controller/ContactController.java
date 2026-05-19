package com.cabxpress.controller;

import com.cabxpress.entity.ContactMessage;
import com.cabxpress.repository.ContactMessageRepository;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    private final ContactMessageRepository contactMessages;
    public ContactController(ContactMessageRepository contactMessages) { this.contactMessages = contactMessages; }
    @PostMapping public ContactMessage create(@RequestBody ContactMessage message) { return contactMessages.save(message); }
    @GetMapping public List<ContactMessage> all() { return contactMessages.findAll(); }
    @GetMapping("/{id}") public ContactMessage one(@PathVariable Long id) { return contactMessages.findById(id).orElseThrow(() -> new com.cabxpress.exception.ApiException(org.springframework.http.HttpStatus.NOT_FOUND, "Message not found")); }
    @PutMapping("/{id}") public ContactMessage update(@PathVariable Long id, @RequestBody ContactMessage input) { input.id = id; return contactMessages.save(input); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { contactMessages.deleteById(id); }
}
