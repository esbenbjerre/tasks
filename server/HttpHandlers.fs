namespace Tasks

module HttpHandlers =

    open System
    open Microsoft.AspNetCore.Http
    open FSharp.Control.Tasks
    open Giraffe
    open Tasks.Models
    open Tasks.UserService

    module User =

        let authenticate (request: LoginRequest) =
            fun (next: HttpFunc) (ctx: HttpContext) ->
                task {
                    let invalidUsernameOrPassword = {Message = "Invalid username or password"}
                    match! Database.Queries.User.getHashByUsername request.Username with
                    | None -> return! (setStatusCode 401 >=> json invalidUsernameOrPassword) next ctx
                    | Some hash ->
                        if Security.verifyPassword request.Password hash then
                            match! Database.Queries.User.getApiKeyByUsername request.Username with
                            | None -> return! (setStatusCode 500 >=> json {Message = "No API key for user"}) next ctx
                            | Some key ->
                                // TODO: Make cookies work
                                let cookieOptions = CookieOptions()
                                cookieOptions.HttpOnly <- true
                                cookieOptions.Domain <- "localhost"
                                cookieOptions.IsEssential <- true
                                cookieOptions.Expires <- DateTimeOffset.Now.AddDays(1.0)
                                ctx.Response.Cookies.Append("apiKey", key, cookieOptions)
                                return! json {ApiKey = key} next ctx
                        else
                            return! (setStatusCode 401 >=> json invalidUsernameOrPassword) next ctx
                }
        
        let getAllUsers =
            fun (next: HttpFunc) (ctx: HttpContext) ->
                task {
                    let! users = Database.Queries.User.getAllUsers ()
                    return! json (users |> List.ofSeq) next ctx
                }

        let getUserProfile =
            fun (next: HttpFunc) (ctx: HttpContext) ->
                task {
                    let user = ctx.GetService<UserService>().user
                    return! json user next ctx
                }

    module Group =

        let getGroups =
            fun (next: HttpFunc) (ctx: HttpContext) ->
                task {
                    let! groups = Database.Queries.Group.getAllGroups ()
                    return! json (groups |> List.ofSeq) next ctx
                }

    module Task =

        let getOpenTasks =
            fun (next: HttpFunc) (ctx: HttpContext) ->
                task {
                    let user = ctx.GetService<UserService>().user
                    let! tasks = Database.Queries.Task.getOpenTasksByUserId user.Id
                    return! json (tasks |> List.ofSeq) next ctx
                }

        let createTask (t: CreateTaskRequest) =
            fun (next: HttpFunc) (ctx: HttpContext) ->
                task {
                    let! _ = Database.Queries.Task.createTask t
                    return! json {Message = "Task created successfully"} next ctx
                }

        let deleteTask (id: int) =
            fun (next: HttpFunc) (ctx: HttpContext) ->
                task {
                    let user = ctx.GetService<UserService>().user
                    match! Database.Queries.Task.getAssignedUser id with
                    | None -> return! json {Message = "Unable to determine assigned user"} next ctx
                    | Some assignedUserId ->
                        if assignedUserId = user.Id then
                            let! _ = Database.Queries.Task.deleteTask id
                            return! json {Message = "Task deleted successfully"} next ctx
                        else
                            return! (setStatusCode 400 >=> json {Message = "You cannot delete a task assigned to someone else"}) next ctx
                }

        let completeTask (id: int) =
            fun (next: HttpFunc) (ctx: HttpContext) ->
                task {
                    match! Database.Queries.Task.getTaskById id with
                    | None -> return! (setStatusCode 400 >=> json {Message = "Task does not exist"}) next ctx
                    | Some t when t.Completed -> return! (setStatusCode 400 >=> json {Message = "Task is already completed"}) next ctx
                    | Some t when t.Deleted -> return! (setStatusCode 400 >=> json {Message = "A deleted task cannot be marked as complete"}) next ctx
                    | Some t ->
                        let user = ctx.GetService<UserService>().user
                        match! Database.Queries.Task.getAssignedUser id with
                        | None -> return! json {Message = "Unable to determine assigned user"} next ctx
                        | Some assignedUserId ->
                            if assignedUserId = user.Id then
                                let! _ = Database.Queries.Task.completeTask id
                                match t.RecurringInterval with
                                | None -> ()
                                | Some _ ->
                                    let! _ = Database.Queries.Task.rescheduleRecurringTask id
                                    ()
                                return! json {Message = "Task marked as complete"} next ctx
                            else
                                return! (setStatusCode 400 >=> json {Message = "You cannot complete a task assigned to someone else"}) next ctx
                }