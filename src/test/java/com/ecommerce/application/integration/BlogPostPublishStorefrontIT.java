package com.ecommerce.application.integration;

import com.ecommerce.application.AbstractIntegrationTest;
import com.ecommerce.application.TestDataFactory;
import com.ecommerce.application.entity.BlogPost;
import com.ecommerce.application.repository.BlogPostRepository;
import com.ecommerce.application.service.impl.BlogPostService;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.awaitility.Awaitility.await;
import java.util.concurrent.TimeUnit;

class BlogPostPublishStorefrontIT extends AbstractIntegrationTest {

    @Autowired
    private BlogPostService blogPostService;

    @Autowired
    private BlogPostRepository blogPostRepository;

    @BeforeEach
    void setUp() {
        blogPostRepository.deleteAll();
        WireMock.reset();

        // Stub the Next.js revalidate endpoint to return 200 OK
        stubFor(WireMock.post(urlEqualTo("/revalidate"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withBody("{\"revalidated\":true}")));
    }

    @Test
    void publishBlogPost_triggersStorefrontRevalidation() {
        BlogPost post = (BlogPost) TestDataFactory.aBlogPost()
                .title("New Fall Collection")
                .slug("new-fall-collection")
                .isPublished(false)
                .build();
        post = blogPostRepository.save(post);

        // Act
        blogPostService.publish(post.getId());

        // Assert: revalidate is called asynchronously, so await the call on WireMock
        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            verify(postRequestedFor(urlEqualTo("/revalidate"))
                    .withRequestBody(matchingJsonPath("$.secret", equalTo("test-revalidate-secret")))
                    .withRequestBody(matchingJsonPath("$.tags[0]", equalTo("blog-posts")))
                    .withRequestBody(matchingJsonPath("$.tags[1]", equalTo("blog-new-fall-collection")))
            );
        });
    }
}
