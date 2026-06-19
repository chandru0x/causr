package com.cursr.backend.config;

import com.cursr.backend.services.AndromediaProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AndromediaProperties.class)
public class ServicesConfig {}
