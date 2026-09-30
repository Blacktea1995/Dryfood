package com.evomap.dryfood.service;

import com.evomap.dryfood.model.Order.Status;

/**
 * So luong don hang theo tung trang thai.
 */
public record StatusCount(Status status, long count) {
}
