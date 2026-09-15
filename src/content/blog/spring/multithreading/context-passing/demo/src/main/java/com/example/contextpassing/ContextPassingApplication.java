package com.example.contextpassing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 线程上下文传递示例应用。
 */
@SpringBootApplication
public class ContextPassingApplication {

    public static void main(String[] args) {
        SpringApplication.run(ContextPassingApplication.class, args);
    }
}

