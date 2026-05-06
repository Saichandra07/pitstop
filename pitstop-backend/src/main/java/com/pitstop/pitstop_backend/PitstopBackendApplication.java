package com.pitstop.pitstop_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PitstopBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(PitstopBackendApplication.class, args);
	}

}
