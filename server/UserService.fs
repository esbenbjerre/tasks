namespace Tasks.UserService

open Tasks.Models

type UserService() =
    [<DefaultValue>]
    val mutable user: User