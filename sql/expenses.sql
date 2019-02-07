CREATE TABLE `expenses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `address` VARCHAR(42) NOT NULL,
  `contact_address` VARCHAR(42) NOT NULL,
  `expense` TEXT NOT NULL,
  `expense_timestamp` TIMESTAMP NOT NULL,
  `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted` BOOLEAN NOT NULL DEFAULT false,
  `is_settlement` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY(id)
);
