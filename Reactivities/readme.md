# Building an app with .net core and react

## Part 2: The walking skeleton
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

in domain => renamed class1 to Value. 

gave it props of public int Id and public string Name. 
- called "auto implemented properties", a concise way of declaring a property when no additional knowledge is required apart from accessing the getter and setter. 
- we're using entity framework which is convention based. when we give it an int Id, it will be used as the primary key. 
- creating the database using entity framework is called "code first" 

===

### Creating dbContext and Service

Now that we have our first entity (value.cs), we're going to use entity framework to scaffold our database.

Do this by using dbContext class. i.e. DataContext which inherits from DbContext 

it won't work as we don't have that in our persistence project. we need to add entity framework into this project!
Open up command shell: 
``CTRL (or CMD) + SHIFT + P`` 
type ``microsoft.entityframeworkcore``, install entityframeworkcore and entityframework.sqlite

Need to upgrade persistence, domain and application's csproj's to netcoreapp2.1 to work with entityframeworkcore! Then need to "dotnet restore API" from the root

``dotnet ef migrations add InitialCreate -p Persistence/ -s API/`` -p refers to the project, -s refers to the startup class.

creates an migration file in persistence, with 

===

### Creating the database 
With migration in place, you can now create the database.

``dotnet ef -h`` for help

``dotnet ef database -h`` specific to database

but we're going to do it in our code. First we will check if database exists, and if not one will be created based on our migrations. 

Do this in program.cs in the API, in program.cs main method:

from:
````cs
public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();

        }
````
to:
````cs
public static void Main(string[] args)
{
    var host = CreateHostBuilder(args).Build();

    using(var scope = host.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try 
        {
            var context = services.GetRequiredService<DataContext>();
            context.Database.Migrate();
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occured during migration");
        }
    }
    host.Run();
}
````

cd into api
``dotnet watch run`` - only works inside the context of the startup project - we will get an error if we use it at the solution level, even with the -p switch.

we should see the file "reactivities.db" created in the api project. go ``command + shift + p`` to open command pallet, type sql, pick "sqlite: open database" and pick "reactivities.db", can now see inside it!

===

### Seeding data using Entity framework Fluent Configuration

Gonna use migrations to seed some data into database

Go back to dataContext.cs
Adds this method: 
````cs
//protected means available to this class or any inherited classes
//override because we're overriding a method that exists in DbContext
protected override void OnModelCreating(ModelBuilder builder)
{
    builder.Entity<Value>()
        .HasData(
            new Value {Id = 1, Name = "Value 101"},
            new Value {Id = 2, Name = "Value 102"},
            new Value {Id = 3, Name = "Value 103"}
        );
}
````

cd's back to the root (reactivities) folder:
``dotnet ef migrations add SeedValues -p Persistence/ -s API``

you can now use the sqlite explorer thing to check out the values, and see that theyre in there.

Next step will be to return them from the API.

===

### Using dependency Injection

we'll inject our dataContext into the valuesController, so we'll have access to our context to make queries to our database via entity framework and return data from there. 

1. generate constructor in values controller
````cs
private readonly DataContext _context;

    public ValuesController(DataContext context)
    {
      _context = context;
    }
````
2. setup Get api to actually get data from the database
````cs
  // GET api/values
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Value>>> Get()
    {
        var values = await _context.Values.ToListAsync();
        return Ok(values);
    }
````
Note: Its best practice to make any queries to the database asynchronous!! 
Whenever you write a method that has a potential to be long running (any call to a db has that potential), you should use async.
3. Do the same for individual get.


===

Summary: 

![](https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg)

"Entities" represent whats in domain (aka the value)
"Use cases" refer to our application project 
"controllers" refer to our API project

Right now our API has too much logic in it, we want our application project to be responsible for this business logic. 


===

## Part 3: Walking Skeleton Part 2 - Client (ui)

- create-react-app
- review the app
- react concepts & typescript
- react state
- fetch data from the api
- CORS
- semantic ui


``npx create-react-app <name>`` => it will default to using yarn if its installed, he prefers using npm => also going to use a typscript switch

in root folder (reactivities):
``npx create-react-app client-app --use-npm --typescript``

cd client-app
npm start

the project will start and open a tab on localhost:3000

===

### Intro to Typescript

Typescript Rocks:
- strong typing 
- object orientated
- better intellisense
- access modifiers (priv, public, protected)
- access to future javascript features
- catches silly mistakes in development
- 3rd party libraries
- easy to learn if you know JS. you can always use as much or little as you want 

Typescript is annoying:
- more upfront code (you don't need it till you need it - but better in the long run!)
- 3rd party libraries (not all have typescript support!)
- strict mode is strict!

===

### Typescript basics demo

````ts
// let data: number | string;

// data = '42';

//for simple types like a number, specifying the type is redundant 

let data = 42; 

data = 10;

//typically we'll be using objects! 
interface ICar {
    color: string;
    model: string;
    topSpeed?: number; //? makes this optional
}

const car1: ICar = {
    color: 'blue',
    model: 'BMW'
}

const car2: ICar = {
    color: 'red',
    model: 'Mercedes',
    topSpeed: 100
}

const multiply = (x: number, y: number): void => {
    // return (x * y).toString();
    y * x;
}
````

===

### Typescript with React 
Theres two choices: to use flow or typescript 

flow: doesn't work well with vs code, performance complaints, smaller community 

super shortcut: rfc + tab 
creates a react functional component

===

### Connecting API to frontend: 

In react: 
````cs
class App extends Component {
  state = {
    values: []
  }

  componentDidMount() {
    axios
      .get('http://localhost:5000/api/values')
      .then((response) => {
        console.log(response);
        this.setState({
          values: response.data
        });
      });
  }

  render() {
    return (
      <div className="App">
        <h1> test</h1>
        <ul>
          {this.state.values.map((value: any) => (
            <li key={value.id}>{value.name}</li>
          ))}
        </ul>
      </div>
    );
  }
}

export default App;
````

add CORS policy to API in startup.cs:
````cs
//in configure services:
services.AddCors(opt => 
            {
                opt.AddPolicy("CorsPolicy", policy => 
                {
                    policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:3000");
                    //things from localhost:3000 will be allowed to use any header and any method 
                });
            });
//in configure:
app.UseCors("CorsPolicy");
````

===

### Adding semantic UI to our app:
semantic-ui comes with typescript support!
https://react.semantic-ui.com/usage
npm install semantic-ui-react 

