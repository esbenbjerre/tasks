namespace Tasks

module HttpFilters =

    open System.Threading.Tasks
    open Microsoft.AspNetCore.Http
    open FSharp.Control.Tasks
    open Giraffe
    open Tasks.UserService
    open Tasks.Models

    let unauthorizedHandler = (setStatusCode 401 >=> json {Message = "Unauthorized"})

    let authorizeWithApiKey: HttpHandler =
        fun (next : HttpFunc) (ctx : HttpContext) ->
            task {
                match ctx.TryGetRequestHeader "X-API-Key" with
                | None -> return! unauthorizedHandler earlyReturn ctx
                | Some key ->
                    match! Database.Queries.User.getUserByApiKey key with
                    | None -> return! unauthorizedHandler earlyReturn ctx
                    | Some user ->
                        let userService = ctx.GetService<UserService>()
                        userService.user <- user
                        return! next ctx
                }