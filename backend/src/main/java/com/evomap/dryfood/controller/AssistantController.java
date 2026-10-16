package com.evomap.dryfood.controller;

import com.evomap.dryfood.model.User;
import com.evomap.dryfood.service.AssistantService;
import org.springframework.web.bind.annotation.*;

/**
 * Tro ly AI DryFood — cong khai (GET), tu dong nhan user neu co token hop le.
 * GET /api/assistant/chat?q=...
 */
@RestController
@RequestMapping("/api/assistant")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @GetMapping("/chat")
    public AssistantService.Reply chat(@RequestParam("q") String q,
                                       @RequestAttribute(value = "user", required = false) User user) {
        return assistantService.answer(q, user);
    }
}