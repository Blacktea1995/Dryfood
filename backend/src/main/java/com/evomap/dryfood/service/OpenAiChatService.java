package com.evomap.dryfood.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Goi OpenAI Chat Completions.
 * - Doc OPENAI_API_KEY / OPENAI_MODEL tu bien moi truong (khong ghi vao file).
 * - Khong gui temperature; max_completion_tokens >= 3000.
 * - Hỗ tro response_format json_object, neu 400 thi retry khong response_format.
 * - Tra ve String content hoac null khi loi/bat ky exception nao.
 */
@Service
public class OpenAiChatService {

    private static final Logger log = LoggerFactory.getLogger(OpenAiChatService.class);
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String KEY = System.getenv("OPENAI_API_KEY");
    private static final String MODEL = System.getenv("OPENAI_MODEL") == null
            ? "gpt-5-mini" : System.getenv("OPENAI_MODEL");
    private static final boolean ENABLED = KEY != null && !KEY.isBlank();

    /** Tra ve content hoac null khi khong co key/loi. */
    public String chat(String systemPrompt, String userPrompt) {
        if (!ENABLED) {
            log.debug("OpenAI disabled (no OPENAI_API_KEY)");
            return null;
        }
        String withFormat = call(systemPrompt, userPrompt, true);
        if (withFormat != null) return withFormat;
        // Neu loi 400 do response_format khong ho tro, retry khong response_format
        String noFormat = call(systemPrompt, userPrompt, false);
        if (noFormat != null) return noFormat;
        // Neu ca 2 deu tra ve loi that su (khong phai 400) -> chi tra ket qua loi dau
        return null;
    }

    private String call(String systemPrompt, String userPrompt, boolean useJsonFormat) {
        try {
            ObjectNode body = JSON.createObjectNode();
            body.put("model", MODEL);
            ArrayNode messages = body.putArray("messages");
            messages.addObject().put("role", "system").put("content", systemPrompt);
            messages.addObject().put("role", "user").put("content", userPrompt);
            body.put("max_completion_tokens", 3500);
            if (useJsonFormat) {
                body.putObject("response_format").put("type", "json_object");
            }

            HttpRequest.Builder rb = HttpRequest.newBuilder(URI.create(OPENAI_URL))
                    .timeout(Duration.ofSeconds(80))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + KEY)
                    .POST(HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
            HttpResponse<String> res = HTTP.send(rb.build(), HttpResponse.BodyHandlers.ofString());

            if (res.statusCode() != 200) {
                log.warn("OpenAI chat {} HTTP {}: {}", useJsonFormat ? "json" : "plain",
                        res.statusCode(),
                        res.body() == null ? "" : res.body().substring(0, Math.min(200, res.body().length())));
                if (res.statusCode() == 400 && useJsonFormat) {
                    return null; // retry khong response_format
                }
                return null;
            }
            JsonNode root = JSON.readTree(res.body());
            JsonNode text = root.path("choices").path(0).path("message").path("content");
            return text.isMissingNode() || text.isNull() ? null : text.asText().trim();
        } catch (Exception e) {
            log.info("OpenAI chat call failed: {}", e.getMessage());
            return null;
        }
    }

    public static boolean isEnabled() {
        return ENABLED;
    }

    /** Tach JSON tu text (bo rao markdown ```...``` neu co). Tra null neu khong parse duoc. */
    public static com.fasterxml.jackson.databind.JsonNode parseJsonResponse(String text) {
        if (text == null) return null;
        String t = text.trim();
        if (t.startsWith("```")) {
            int first = t.indexOf('\n');
            int last = t.lastIndexOf("```");
            if (first > 0 && last > first) {
                t = t.substring(first + 1, last).trim();
            }
        }
        try {
            return JSON.readTree(t);
        } catch (Exception e) {
            return null;
        }
    }
}