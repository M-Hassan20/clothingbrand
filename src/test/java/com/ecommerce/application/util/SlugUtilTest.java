package com.ecommerce.application.util;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class SlugUtilTest {

    @Test
    void toSlug_convertsSpacesToHyphens() {
        assertThat(SlugUtil.toSlug("hello world")).isEqualTo("hello-world");
    }

    @Test
    void toSlug_stripsSpecialCharacters() {
        assertThat(SlugUtil.toSlug("hello @world!!!")).isEqualTo("hello-world");
    }

    @Test
    void toSlug_normalizesAccentedCharacters() {
        assertThat(SlugUtil.toSlug("café")).isEqualTo("cafe");
    }

    @Test
    void toSlug_convertsToLowerCase() {
        assertThat(SlugUtil.toSlug("Hello World")).isEqualTo("hello-world");
    }

    @Test
    void toSlug_handlesConsecutiveHyphens() {
        assertThat(SlugUtil.toSlug("hello--world")).isEqualTo("hello-world");
    }
}
