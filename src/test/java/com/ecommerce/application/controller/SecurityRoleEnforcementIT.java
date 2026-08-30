package com.ecommerce.application.controller;

import com.ecommerce.application.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SecurityRoleEnforcementIT extends AbstractIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @BeforeEach
    void setUpMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    void adminEndpoint_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpoint_customerRole_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/products")
                .with(user("customer").roles("CUSTOMER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminEndpoint_adminRole_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/products")
                .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void customerEndpoint_customerRole_returns200() throws Exception {
        mockMvc.perform(get("/api/orders")
                .param("userId", "1")
                .with(user("customer").roles("CUSTOMER")))
                .andExpect(status().isOk());
    }
}
