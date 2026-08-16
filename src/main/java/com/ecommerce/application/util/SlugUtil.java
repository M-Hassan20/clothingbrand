package com.ecommerce.application.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class SlugUtil {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]+");

    public static String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String noWhitespace = WHITESPACE.matcher(normalized).replaceAll("-");
        String slug = NON_LATIN.matcher(noWhitespace).replaceAll("");
        return slug.toLowerCase().replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
    }
}
