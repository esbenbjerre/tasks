namespace Tasks

open System
open Microsoft.Data.Sqlite
open FSharp.Data.Dapper
open Tasks.Models

module Database =

    module Connection =
        let private mkOnDiskConnectionString (dataSource: string) = sprintf "Data Source = %s; foreign keys = true;" dataSource
        let makeOnDisk () = new SqliteConnection (mkOnDiskConnectionString "./data.db")

    module Queries =
        let private connection () = SqliteConnection (Connection.makeOnDisk())
        let inline (=>) a b = a, box b
        let querySingleOptionAsync<'R> = querySingleOptionAsync<'R> (connection)
        let querySeqAsync<'R> = querySeqAsync<'R> (connection)

        module Schema =

            let createTables = querySingleOptionAsync<unit> {
                script """
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
                """
            }

        module User =

            let getHashByUsername (username: string) = querySingleOptionAsync<string> {
                script """
                    SELECT
                        hash
                    FROM
                        `user`
                    WHERE
                        username = @username
                    LIMIT 1;
                """
                parameters (dict ["username" => username])
            }

            let getApiKeyByUsername (username: string) = querySingleOptionAsync<string> {
                script """
                    SELECT
                        api_key
                    FROM
                        `user`
                    WHERE
                        username = @username
                    LIMIT 1;
                """
                parameters (dict ["username" => username])
            }

            let getUserByApiKey (key: string) = querySingleOptionAsync<User> {
                script """
                    SELECT
                        id, username, name
                    FROM
                        `user`
                    WHERE
                        api_key = @api_key
                    LIMIT 1;
                """
                parameters (dict ["api_key" => key])
            }

            let getAllUsers () = querySeqAsync<Identifiable> {
                script """
                    SELECT
                        id, name
                    FROM
                        `user`;
                """
            }

        module Group =

            let getAllGroups () = querySeqAsync<Identifiable> {
                script """
                    SELECT
                        id, name
                    FROM
                        `group`;
                """
            }

        module Task =

            let getOpenTasksByUserId (userId: int) = querySeqAsync<Task> {
                script """
                    SELECT
                        *
                    FROM
                        `task`
                    WHERE
                        completed = 0
                        AND
                            deleted = 0
                        AND
                            (assigned_user = $user_id
                            OR
                                assigned_group
                                    IN
                                        (SELECT
                                            group_id from `user_group`
                                        WHERE
                                            user_id = $user_id
                                        )
                            )
                    ORDER BY
                        description ASC;
                """
                parameters (dict ["user_id" => userId])
            }

            let getTaskById (id: int) = querySingleOptionAsync<Task> {
                script """
                    SELECT
                        *
                    FROM
                        `task`
                    WHERE
                        id = @id
                    LIMIT 1;
                """
                parameters (dict ["id" => id])
            }

            let getAssignedUser (id: int) = querySingleOptionAsync<int> {
                script """
                    SELECT
                        assigned_user
                    FROM
                        `task`
                    WHERE
                        id = @id
                    LIMIT 1;
                """
                parameters (dict ["id" => id])
            }

            let createTask (task: CreateTaskRequest) = querySingleOptionAsync<unit> {
                script """
                    INSERT INTO `task`
                        (id, description, notes, completed, deadline, recurring_interval, assigned_group, assigned_user)
                    VALUES
                        (NULL, @description, @notes, 0, @deadline, @recurring_interval, @assigned_group, @assigned_user);
                """
                parameters (dict [
                    "description" => task.Description;
                    "notes" => task.Notes;
                    "deadline" => task.Deadline;
                    "recurring_interval" => task.RecurringInterval;
                    "assigned_group" => task.AssignedGroup;
                    "assigned_user" => task.AssignedUser
                    ])
            }

            let deleteTask (id: int) = querySingleOptionAsync<unit> {
                script """
                    UPDATE `task`
                    SET
                        deleted = 1
                    WHERE
                        id = @id;
                """
                parameters (dict ["id" => id])
            }

            let completeTask (id: int) = querySingleOptionAsync<unit> {
                script """
                    UPDATE `task`
                    SET
                        completed = 1
                    WHERE
                        id = @id;
                """
                parameters (dict ["id" => id])
            }

            let rescheduleRecurringTask (id: int) = querySingleOptionAsync<unit> {
                script """
                    INSERT INTO `task`
                        (description, notes, deadline, recurring_interval, assigned_group, assigned_user)
                    SELECT description, notes, 
                    (SELECT
                        CASE
                            WHEN recurring_interval = NULL THEN NULL
                            WHEN recurring_interval = 0 THEN STRFTIME("%s", deadline, "unixepoch", "+1 hour")
                            WHEN recurring_interval = 1 THEN STRFTIME("%s", deadline, "unixepoch", "+1 day")
                            WHEN recurring_interval = 2 THEN STRFTIME("%s", deadline, "unixepoch", "+7 day")
                            WHEN recurring_interval = 3 THEN STRFTIME("%s", deadline, "unixepoch", "+1 month")
                            WHEN recurring_interval = 4 THEN STRFTIME("%s", deadline, "unixepoch", "+1 year")
                        END
                        AS
                            deadline
                        FROM
                            `task`
                        WHERE
                            id = @id
                    ),
                    recurring_interval, assigned_group, assigned_user
                FROM
                    `task`
                WHERE
                    id = @id;
                """
                parameters (dict ["id" => id])
            }