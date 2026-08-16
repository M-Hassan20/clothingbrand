package com.ecommerce.application.util;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;

public class HtmlSanitizerUtil {

    // Allows the formatting a rich text editor (e.g. Tiptap) typically produces:
    // headings, bold/italic, links, images, lists, blockquotes — strips <script>, event handlers, etc.
    private static final PolicyFactory POLICY = Sanitizers.FORMATTING
            .and(Sanitizers.LINKS)
            .and(Sanitizers.IMAGES)
            .and(Sanitizers.BLOCKS)
            .and(new HtmlPolicyBuilder()
                    .allowElements("h1", "h2", "h3", "h4", "p", "br", "hr")
                    .toFactory());

    public static String sanitize(String rawHtml) {
        if (rawHtml == null) return null;
        return POLICY.sanitize(rawHtml);
    }
}