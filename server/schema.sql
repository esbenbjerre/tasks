CREATE TABLE IF NOT EXISTS `user` (
    id INTEGER NOT NULL PRIMARY KEY,
    username TEXT NOT NULL,
    name TEXT NOT NULL,
    hash TEXT NOT NULL,
    api_key TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS `group` (
    id INTEGER NOT NULL PRIMARY KEY,
    name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS `user_group` (
    id INTEGER NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES `user`(id),
    FOREIGN KEY(group_id) REFERENCES `group`(id)
);
CREATE TABLE IF NOT EXISTS `recurring_interval` (
    id INTEGER NOT NULL PRIMARY KEY,
    name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS `task` (
    id INTEGER NOT NULL PRIMARY KEY,
    description TEXT NOT NULL,
    notes TEXT NOT NULL,
    completed INT(1) DEFAULT 0 NOT NULL,
    deleted INT(1) DEFAULT 0 NOT NULL,
    deadline INTEGER NULL,
    recurring_interval INTEGER NULL,
    assigned_group INTEGER NULL,
    assigned_user INTEGER NOT NULL,
    FOREIGN KEY(recurring_interval) REFERENCES `recurring_interval`(id),
    FOREIGN KEY(assigned_group) REFERENCES `group`(id),
    FOREIGN KEY(assigned_user) REFERENCES `user`(id)
);