package com.cursr.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketBrokerConfig implements WebSocketMessageBrokerConfigurer {

  @Value("${app.websocket.allowed-origin:http://localhost:3000}")
  private String allowedOrigin;

  @Value("${app.websocket.max-connections:300}")
  private int maxConnections;

  private WebSocketConnectionLimitInterceptor connectionLimitInterceptor;

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.enableSimpleBroker("/topic");
    registry.setApplicationDestinationPrefixes("/app");
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    connectionLimitInterceptor = new WebSocketConnectionLimitInterceptor(maxConnections);
    registry.addEndpoint("/ws/anomalies")
        .setAllowedOriginPatterns(allowedOrigin)
        .addInterceptors(connectionLimitInterceptor);
  }

  @Override
  public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
    registry
        .setMessageSizeLimit(64 * 1024)
        .setSendBufferSizeLimit(512 * 1024)
        .setSendTimeLimit(20_000);
  }

  @EventListener
  public void handleSessionDisconnect(SessionDisconnectEvent event) {
    if (connectionLimitInterceptor != null) {
      connectionLimitInterceptor.onDisconnect();
    }
  }
}
