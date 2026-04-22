# Hype-For-Types

## Schedule
Aug 24 - Why Type Theory / Simply Typed Lambda Calculus

Aug 31 - Algebraic Data Types

Sep 07 - No Lecture / Labour Day

Sep 14 - Montague Grammar (Type Theory for Linguistics) 

Sep 21 - Constructive Logic 

Sep 28 - Substructural Logic 

Oct 05 - Session Types/Concurrency

Oct 12 - No Lecture / Fall Break

Oct 19 - Parametric Polymorphism 

Oct 26 - Dependent Types 

Nov 02 - Automatic Theorem Proving

Nov 09 - Quantum Type Theory

Nov 16 - SML Bee 

Nov 23 - Homotopy Type Theory

Nov 30 - Tentative Guest Lecture, Can Swap Dates



Idea of course progression and narrative:
1) What are we doing?
   - Introduce Lambda Calculus as a foundation for computation.
   - Show how this leads to the Kleene Roser Paradox
   - Show how Adding types to make STLC fixes this
   - Finish talking about STLC and why types are important as a foundation but also as a tool to make guarantees.

2) With STLC under our belt, we explore how fundamental types combine and interact. We lay the structural foundation for future topics, showing how these basic algebraic combinations correspond directly to mathematical operations.
   
4) Students are already familiar with the concept of types in programming, but here we break that boundary. We explore Montague Grammar to show how types govern human language and syntax. This proves that type theory is an invaluable tool for extracting structure and meaning.
   
6) Having explored the "types" side of the universe in code and language, we introduce the formal connection to mathematics. We clearly establish the Curry-Howard Isomorphism.

7) CLogic is beautiful. But what if we "stress test" it by stripping away foundational structural axioms? We explore what it means to drop rules like weakening or contraction, arriving at a logic of resources. We ground this practically by showing how these logical rules give us memory safety and resource management in modern systems programming.

8) We move slightly away from pure logic and back into practical types, showing how substructural rules govern safe, deadlock-free concurrent communication.

10) Returning to the core [lambda cube](https://en.wikipedia.org/wiki/Lambda_cube), we explore System F. We show the strong power of what we can express when we allow types to depend on other types, giving us highly generalized, infinitely expressive architectures (generics).

11) The logical progression is to look at even more complicated types. Building directly on the abstraction of polymorphism, we dissolve the barrier between types and values. If a type can depend on a type, it can now depend on a value. This lays the ultimate foundation for our final projects

12) We reach the climax of the Curry-Howard narrative. Using the dependent types we just mastered, we show how we can do something powerful: writing code that mathematically proves its own absolute correctness.

13) Now we are in the hyped hype! We take the rigorous theoretical toolkit we've spent the semester building and use it to understand and model the bleeding edge of computation: quantum states and operations.

14) SML Bee!

15) We reach the absolute summit of the course. People get their deepest mathematical assumptions questioned as we explore how type theory intersects with geometry, equivalence, and the fundamental shape of spaces.

16) And we end with a guest lecture.
   

