namespace Tasks.Models

open System
open Giraffe

[<CLIMutable>]
type Message =
    {
        Message: string
    }

[<CLIMutable>]
type Identifiable =
    {
        Id: int
        Name: string
    }

[<CLIMutable>]
type LoginRequest =
    {
        Username: string
        Password: string
    }

[<CLIMutable>]
type LoginResponse =
    {
        ApiKey: string
    }

[<CLIMutable>]
type User =
    {
        Id: int
        Username: string
        Name: string
    }

[<CLIMutable>]
type CreateTaskRequest =
    {
        Description: string
        Notes: string
        Deadline: int64
        RecurringInterval: int64 option
        AssignedGroup: int64 option
        AssignedUser: int64
    }

    member this.HasErrors () =
        if this.Description.Length = 0 then Some "Description must be non-empty"
        else if this.Deadline > 0L && DateTimeOffset.FromUnixTimeSeconds(this.Deadline).CompareTo(DateTimeOffset.Now) < 0 then Some "Deadline must be in the future"
        else if this.Deadline = 0L && Option.isSome(this.RecurringInterval) then Some "Recurring tasks must specify a deadline"
        else if (this.RecurringInterval |> Option.fold (fun _ i -> not (List.contains i [0L; 1L; 2L; 3L; 4L])) false) then Some "Recurring interval must be in [0, 1, 2, 3, 4]"
        else None

    interface IModelValidation<CreateTaskRequest> with
        member this.Validate() =
            let validationError message = setStatusCode 400 >=> json {Message = message}
            match this.HasErrors() with
            | None -> Ok this
            | Some error -> Error (validationError error)

[<CLIMutable>]
type Task =
    {
        Id: int64
        Description: string
        Notes: string
        Completed: bool
        Deleted: bool
        Deadline: int64 option
        RecurringInterval: int64 option
        AssignedGroup: int64 option
        AssignedUser: int64
    }