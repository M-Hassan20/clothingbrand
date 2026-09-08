package com.ecommerce.application.util;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class HtmlSanitizerUtilTest {

    @Test
    void sanitize_allowsSafeFormattingTags() {
        String input = "<p><strong>Hello</strong> <em>world</em></p>";
        String output = HtmlSanitizerUtil.sanitize(input);
        assertThat(output).contains("<strong>Hello</strong>", "<em>world</em>");
    }

    @Test
    void sanitize_stripsScriptTags() {
        String input = "<p>Hello <script>alert('xss')</script>world</p>";
        String output = HtmlSanitizerUtil.sanitize(input);
        assertThat(output).doesNotContain("<script>");
        assertThat(output).isEqualTo("<p>Hello world</p>");
    }

    @Test
    void sanitize_stripsEventHandlers() {
        String input = "<p><span onclick=\"alert('xss')\">Hello</span></p>";
        String output = HtmlSanitizerUtil.sanitize(input);
        assertThat(output).doesNotContain("onclick");
        assertThat(output).isEqualTo("<p>Hello</p>");
    }

    @Test
    void sanitize_returnsNullForNullInput() {
        assertThat(HtmlSanitizerUtil.sanitize(null)).isNull();
    }
}
