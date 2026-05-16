package com.causr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
@EnableScheduling
@SpringBootApplication
public class CausrLogProcessorApplication {

	public static void main(String[] args) {
		SpringApplication.run(CausrLogProcessorApplication.class, args);
	}

}
