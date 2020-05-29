# Building an app with .net core and react

### Part 2: The walking skeleton
A walking skeleton is a tiny implementation of the system that performs a small end-to-end function that links together the main architectural components. The architecture and functionality can then evolve in parrallel.

This will be the theme: We will do the simplest thing we can, to ensure our end-to-end walking skeleton is up and working.

This module will include: 
- clean architecture
- using dotnet cli
- reviewing project templates
- running the app
- EF migrations (scaffold database from our code and auto-create it, "entity-framework migration")
- seeding data
- postman (check api is workin)
- using git for source control 

===

make a new directory "reactivities", cd into it

make a new dotnet project:
``dotnet new -h`` shows you all available starter templates. We're going to use webapi. There is an option for a react and react redux dotnet project, however we're going to create ours seperately and connect the dotnet with the react by using the api calls. 

steps:
1. ``dotnet new sln``

Going to split project up into:
- api project and an application project (to contain business logic)
- a domain project (to contain domain entities)
- a persistance project (responsible for communicating with database). 

Everything apart from API project will be a class library.
2. ``dotnet new classlib -n Domain`` (-n gives it its name)
3. ``dotnet new classlib -n Application`` 
4. ``dotnet new classlib -n Persistence``
5. ``dotnet new webapi -n API``

if you ls you'll have 3 solution folders and the api folder. our solution knows nothing about those folders though yet! 

Also need to add project dependencies to each other, so each project knows about the other. 

===

### Creating Project references using the CLI

``dotnet sln -h`` shows you what you can do with your solution file. 

``dotnet sln add Domain/`` will search through the domain folder and look for a csproj file, and if it finds one it will add it to the solution. 

do them all:
``dotnet sln add Domain/``
``dotnet sln add Application/``
``dotnet sln add Persistence``
``dotnet sln add API``

``dotnet sln list`` will show all the projects in the solutions file 

now need to let each project know what its dependencies are. do it by adding references to our projects 

our domain project is the center of our application universe, it will have no depencencies on other projects. 

application project will depend on domain and persistence:
``cd Application``
``dotnet add reference ../Domain/``
``dotnet add reference ../Persistence``

api project will need reference to application project. because application has a reference to domain, api project will need a "transitive" dependence on the domain, so we only need to specify the application as a reference to the api project. 

=> cd into api
``dotnet add reference ../application/``

our persistence project will have a dependency on the domain project, because domain will have entities that the persistence project will need to work with.

cd into persistence 
``dotnet add reference ../domain``

when to use a solution:
either 1. when you want to use visual studio
or 2. when you want to manage several projects as a single unit.

===

### Reviewing project files 
program.cs in the api project:

when we start the api application, dotnet will look inside the program class for the Main method. This is the method it will execute when we start the application. 

Usually calls "createHostBuilder", which calls "useStartup" for additional config. 
This will use the appsettings.json file 

If we're running in development, it will override the appsettings.json file. Appsettings.json will be read in every mode we're running in, but the more specific ones are only read from their respetive environments (and over ride the appsettings).

configureServices is the dependency injection container! we'll consume services and other areas we make of our app here. 

===

### Getting app to run!

``dotnet run`` it says "couldnt find a project to run"

need to specify the api project:
``dotnet run -p API/``

===

### Creating a domain entity

