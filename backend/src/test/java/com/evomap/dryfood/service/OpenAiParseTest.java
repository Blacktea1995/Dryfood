package com.evomap.dryfood.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Kiem tra parse JSON tu OpenAI (hop le, thieu truong, boc markdown). */
public class OpenAiParseTest {

    @Test
    void jsonHopLeParseOk() {
        JsonNode n = OpenAiChatService.parseJsonResponse("{\"summary\":\"ok\",\"kpi_insights\":[]}");
        assertNotNull(n);
        assertEquals("ok", n.path("summary").asText());
    }

    @Test
    void jsonBocMarkdownParseOk() {
        String wrapped = "```json\n{\"summary\":\"ok\",\"kpi_insights\":[]}\n```";
        JsonNode n = OpenAiChatService.parseJsonResponse(wrapped);
        assertNotNull(n);
        assertEquals("ok", n.path("summary").asText());
    }

    @Test
    void jsonThieuTruongVanParseDuoc() {
        // Parse chi kiem tra JSON hop le; validator se bat thieu truong
        JsonNode n = OpenAiChatService.parseJsonResponse("{\"summary\":\"chi co summary\"}");
        assertNotNull(n);
        assertTrue(n.path("kpi_insights").isMissingNode());
    }

    @Test
    void textKhongPhaiJsonTraNull() {
        assertNull(OpenAiChatService.parseJsonResponse("Xin loi toi khong tra loi duoc"));
    }
}