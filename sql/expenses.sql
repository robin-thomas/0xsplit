CREATE TABLE `expenses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `address` VARCHAR(42) NOT NULL,
  `contact_address` VARCHAR(42) NOT NULL,
  `expense` TEXT NOT NULL,
  `expense_timestamp` TIMESTAMP NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);
