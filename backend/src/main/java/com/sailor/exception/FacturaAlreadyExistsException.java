package com.sailor.exception;

public class FacturaAlreadyExistsException extends RuntimeException {
    public FacturaAlreadyExistsException(String message) {
        super(message);
    }
}
